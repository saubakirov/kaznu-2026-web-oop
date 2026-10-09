"""Course syllabus overview and structure endpoint."""

from fastapi import APIRouter, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/course", tags=["Course"])


class TopicOverview(BaseModel):
    """Topic metadata in course syllabus."""

    id: str
    title: str
    description: str
    is_ready: bool


class WeekOverview(BaseModel):
    """Weekly module metadata."""

    week_number: int
    title: str
    subtitle: str
    status: str
    topics: list[TopicOverview]


class CourseOverviewResponse(BaseModel):
    """Course curriculum high-level structure."""

    title: str
    code: str
    total_weeks: int
    weeks: list[WeekOverview]


@router.get("/overview", response_model=CourseOverviewResponse, status_code=status.HTTP_200_OK)
def get_course_overview() -> CourseOverviewResponse:
    """Return course roadmap overview and module status."""
    return CourseOverviewResponse(
        title="Объектно-Ориентированное Программирование",
        code="CS2203",
        total_weeks=3,
        weeks=[
            WeekOverview(
                week_number=1,
                title="Неделя 1",
                subtitle="Основы ООП & Инкапсуляция",
                status="ready_for_content",
                topics=[
                    TopicOverview(
                        id="w1-t1",
                        title="Классы, объекты и инкапсуляция",
                        description="Модель сущности Passenger и сокрытие состояния баланса",
                        is_ready=True,
                    ),
                    TopicOverview(
                        id="w1-t2",
                        title="Валидаторы и списание средств",
                        description="Методы списания, исключения и валидация тарифов",
                        is_ready=False,
                    ),
                    TopicOverview(
                        id="w1-t3",
                        title="Лабораторный практикум недели",
                        description="Реализация первого ядра сущностей системы Avtobys",
                        is_ready=False,
                    ),
                ],
            ),
            WeekOverview(
                week_number=2,
                title="Неделя 2",
                subtitle="Наследование, Полиморфизм & SOLID",
                status="in_development",
                topics=[
                    TopicOverview(
                        id="w2-t1",
                        title="Иерархия тарифов и пассажиров",
                        description="Наследование базового тарифа, льготные и студенческие тарифы",
                        is_ready=False,
                    ),
                    TopicOverview(
                        id="w2-t2",
                        title="Принципы SOLID на практике",
                        description="Single Responsibility и Open/Closed в транзакционной логике",
                        is_ready=False,
                    ),
                    TopicOverview(
                        id="w2-t3",
                        title="Практикум: полиморфная оплата",
                        description="Обработка разнородных платежных средств через общий интерфейс",
                        is_ready=False,
                    ),
                ],
            ),
            WeekOverview(
                week_number=3,
                title="Неделя 3",
                subtitle="Паттерны проектирования GoF & Архитектура",
                status="in_development",
                topics=[
                    TopicOverview(
                        id="w3-t1",
                        title="Паттерны Strategy и Factory",
                        description="Стратегии расчета стоимости и фабрика валидаторов",
                        is_ready=False,
                    ),
                    TopicOverview(
                        id="w3-t2",
                        title="Паттерн Observer в трансляции событий",
                        description="Шина событий валидации билетов и пуш-уведомления",
                        is_ready=False,
                    ),
                    TopicOverview(
                        id="w3-t3",
                        title="Финальный проект и экзамен",
                        description="Сквозной архитектурный квест системы городского транспорта",
                        is_ready=False,
                    ),
                ],
            ),
        ],
    )
